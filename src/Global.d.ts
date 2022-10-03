declare module "*.module.css";

declare module "*.svg" {
    const content: any;
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  }