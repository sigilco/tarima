$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
    if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
        throw 'Unavailable'
    }
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false, $true)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false, $true)
    Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

public static class SecretsCredentials {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct Credential {
        public uint Flags;
        public uint Type;
        public IntPtr TargetName;
        public IntPtr Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        public IntPtr TargetAlias;
        public IntPtr UserName;
    }

    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredWrite(ref Credential credential, uint flags);
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredRead(string target, uint type, uint flags, out IntPtr credential);
    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredDelete(string target, uint type, uint flags);
    [DllImport("advapi32.dll", ExactSpelling = true)]
    private static extern void CredFree(IntPtr credential);

    private static readonly Encoding Utf8 = new UTF8Encoding(false, true);
    private static void Zero(IntPtr pointer, int length) {
        if (pointer != IntPtr.Zero) for (int i = 0; i < length; i++) Marshal.WriteByte(pointer, i, 0);
    }
    public static string Target(string service, string name) {
        // Length framing avoids both delimiter collisions and JSON serializer differences.
        byte[] a = Utf8.GetBytes(service), b = Utf8.GetBytes(name);
        if (a.Length > 256 || b.Length > 256) throw new ArgumentException();
        byte[] framed = new byte[4 + a.Length + b.Length];
        framed[0] = (byte)(a.Length >> 8); framed[1] = (byte)a.Length;
        framed[2] = (byte)(b.Length >> 8); framed[3] = (byte)b.Length;
        Buffer.BlockCopy(a, 0, framed, 4, a.Length);
        Buffer.BlockCopy(b, 0, framed, 4 + a.Length, b.Length);
        // Credential targets are case-insensitive; hex preserves identity under case folding.
        string target = "secrets:" + BitConverter.ToString(framed).Replace("-", "").ToLowerInvariant();
        if (target.Length > 32767) throw new ArgumentException();
        return target;
    }
    public static void Write(string target, string value) {
        byte[] bytes = Utf8.GetBytes(value);
        IntPtr blob = IntPtr.Zero, targetPointer = IntPtr.Zero;
        try {
            if (bytes.Length > 2560) throw new ArgumentException();
            targetPointer = Marshal.StringToCoTaskMemUni(target);
            // Allocate one byte even for an empty secret; its native length remains zero.
            blob = Marshal.AllocHGlobal(Math.Max(1, bytes.Length));
            Marshal.WriteByte(blob, 0, 0);
            if (bytes.Length != 0) Marshal.Copy(bytes, 0, blob, bytes.Length);
            Credential credential = new Credential {
                Type = 1, TargetName = targetPointer, CredentialBlob = blob,
                CredentialBlobSize = (uint)bytes.Length, Persist = 3
            };
            if (!CredWrite(ref credential, 0)) throw new Win32Exception(Marshal.GetLastWin32Error());
        } finally {
            if (blob != IntPtr.Zero) { Zero(blob, Math.Max(1, bytes.Length)); Marshal.FreeHGlobal(blob); }
            if (targetPointer != IntPtr.Zero) Marshal.ZeroFreeCoTaskMemUnicode(targetPointer);
            Array.Clear(bytes, 0, bytes.Length);
        }
    }
    public static string Read(string target) {
        IntPtr pointer = IntPtr.Zero;
        Credential credential = new Credential();
        byte[] bytes = null;
        try {
            if (!CredRead(target, 1, 0, out pointer)) throw new Win32Exception(Marshal.GetLastWin32Error());
            credential = (Credential)Marshal.PtrToStructure(pointer, typeof(Credential));
            if (credential.CredentialBlobSize > 2560 || (credential.CredentialBlobSize != 0 && credential.CredentialBlob == IntPtr.Zero)) throw new ArgumentException();
            bytes = new byte[(int)credential.CredentialBlobSize];
            if (bytes.Length != 0) Marshal.Copy(credential.CredentialBlob, bytes, 0, bytes.Length);
            return Utf8.GetString(bytes);
        } finally {
            if (bytes != null) Array.Clear(bytes, 0, bytes.Length);
            if (pointer != IntPtr.Zero) {
                try {
                    // Rejected native lengths must not turn cleanup into an unbounded write.
                    Zero(credential.CredentialBlob, (int)Math.Min(credential.CredentialBlobSize, 2560u));
                } finally { CredFree(pointer); }
            }
        }
    }
    public static bool Delete(string target) {
        if (!CredDelete(target, 1, 0)) throw new Win32Exception(Marshal.GetLastWin32Error());
        return true;
    }
}
'@
    $request = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($request.service -isnot [string] -or $request.name -isnot [string]) { throw 'Invalid request' }
    $target = [SecretsCredentials]::Target($request.service, $request.name)
    switch -CaseSensitive ($request.operation) {
        'get' { $value = [SecretsCredentials]::Read($target) }
        'set' {
            if ($request.value -isnot [string]) { throw 'Invalid request' }
            [SecretsCredentials]::Write($target, $request.value)
            $value = $true
        }
        'delete' { $value = [SecretsCredentials]::Delete($target) }
        default { throw 'Invalid request' }
    }
    [Console]::Out.WriteLine((ConvertTo-Json -Compress -InputObject @{ value = $value }))
    exit 0
} catch {
    # Never serialize exception messages: native and PowerShell errors can contain input.
    $code = 'ERR_SECRETS_STORE'
    if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
        # Full-language APIs may themselves be forbidden, so use only a fixed ASCII literal.
        Write-Output '{"error":"ERR_SECRETS_UNAVAILABLE"}'
        exit 1
    }
    $exception = $_.Exception
    while ($null -ne $exception.InnerException) { $exception = $exception.InnerException }
    if ($exception -is [System.ComponentModel.Win32Exception]) { $code = $exception.NativeErrorCode }
    [Console]::Out.WriteLine((ConvertTo-Json -Compress -InputObject @{ error = $code }))
    exit 1
}
