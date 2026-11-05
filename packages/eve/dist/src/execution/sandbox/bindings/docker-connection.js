import{randomUUID}from"node:crypto";import{shellQuote}from"#execution/sandbox/shell-quote.js";import{dirname}from"node:path/posix";import{stopDockerContainerIfRunning}from"#execution/sandbox/bindings/docker-container.js";import{setDockerNetworkPolicy}from"#execution/sandbox/bindings/docker-network.js";import{expectDockerSuccess}from"#execution/sandbox/bindings/docker-utils.js";function createDockerConnection(e){let{cli:t,containerIdentity:n}=e;async function killSpawnTree(e){await t.run([`exec`,n,`bash`,`-c`,`pid_file="$1"
target="$(cat "$pid_file" 2>/dev/null)" || exit 0
[ -n "$target" ] || exit 0
kill_tree() {
  local parent="$1" dir child ppid line
  for dir in /proc/[0-9]*; do
    child="\${dir#/proc/}"
    ppid=""
    while IFS= read -r line; do
      case "$line" in
        PPid:*) ppid="\${line#PPid:}"; ppid="\${ppid//[^0-9]/}"; break ;;
      esac
    done < "$dir/status" 2>/dev/null
    [ "$ppid" = "$parent" ] && kill_tree "$child"
  done
  kill -9 "$parent" 2>/dev/null
}
kill_tree "$target"
rm -f "$pid_file"
exit 0`,`eve-kill-tree`,e]).catch(()=>{})}return{extensions:{setNetworkPolicy:e=>setDockerNetworkPolicy(t,n,e)},async spawn(e){let r=[`exec`,...e.stdin===!0?[`-i`]:[],`-w`,e.workingDirectory];for(let[t,n]of Object.entries(e.env))r.push(`-e`,`${t}=${n}`);let i=`/tmp/.eve-sbx-spawn-${randomUUID()}.pid`,a=`echo "$$" > ${shellQuote(i)}; bash -lc ${shellQuote(e.command)}; status=$?; rm -f ${shellQuote(i)}; exit $status`;r.push(n,`bash`,`-c`,a);let o=t.stream(r,{signal:e.signal,stdin:e.stdin});return e.signal?.addEventListener(`abort`,()=>void killSpawnTree(i),{once:!0}),{stdin:o.stdin,stdout:o.stdout,stderr:o.stderr,async wait(){return await o.wait()},async kill(){await killSpawnTree(i),await o.kill()}}},async readFile(e){let r=shellQuote(e.path),i=await t.run([`exec`,n,`bash`,`-lc`,`if [ -e ${r} ]; then exec cat ${r}; else exit 43; fi`],{signal:e.signal});return i.exitCode===43?null:(expectDockerSuccess(i,`read "${e.path}" from sandbox container`),i.stdoutBytes)},async removePath(e){let r=`${e.recursive===!0?`r`:``}${e.force===!0?`f`:``}`,i=[`exec`,n,`rm`,...r.length>0?[`-${r}`]:[],`--`,e.path],a=await t.run(i,{signal:e.signal});expectDockerSuccess(a,`remove "${e.path}" from sandbox container`)},stop:()=>stopDockerContainerIfRunning(t,n),async writeFiles(e){for(let r of e.files){let i=await t.run([`exec`,`-i`,n,`bash`,`-lc`,`mkdir -p ${shellQuote(dirname(r.path))} && cat > ${shellQuote(r.path)}`],{signal:e.signal,stdin:r.content});expectDockerSuccess(i,`write "${r.path}" into sandbox container`)}}}}export{createDockerConnection};