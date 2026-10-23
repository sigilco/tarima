import { PhoneFrame } from "./PhoneFrame";
import { ChatBriefPreview } from "./ChatBriefPreview";

function Preview() {
  return (
    <PhoneFrame>
      <ChatBriefPreview />
    </PhoneFrame>
  );
}

export default {
  Component: Preview,
};
