import { PhoneFrame } from "./PhoneFrame";
import { CallTranscriptPreview } from "./CallTranscriptPreview";

function Preview() {
  return (
    <PhoneFrame>
      <CallTranscriptPreview />
    </PhoneFrame>
  );
}

export default {
  Component: Preview,
};
