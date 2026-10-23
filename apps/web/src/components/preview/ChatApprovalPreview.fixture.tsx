import { PhoneFrame } from "./PhoneFrame";
import { ChatApprovalPreview } from "./ChatApprovalPreview";

function Preview() {
  return (
    <PhoneFrame>
      <ChatApprovalPreview />
    </PhoneFrame>
  );
}

export default {
  Component: Preview,
};
