/**
 * 이 파일은 TypeScript에게 '.svg' 확장자를 가진 파일을 import할 때,
 * 이를 React 컴포넌트로 인식하도록 알려주는 타입 선언 파일입니다.
 */
declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
