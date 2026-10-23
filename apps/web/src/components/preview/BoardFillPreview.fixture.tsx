import { PhoneFrame } from "./PhoneFrame";
import { BoardFillPreview } from "./BoardFillPreview";

function Preview() {
  return (
    <PhoneFrame>
      <BoardFillPreview />
    </PhoneFrame>
  );
}

export default {
  Component: Preview,
};
