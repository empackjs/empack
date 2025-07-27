import { Response, Request } from "../../../core";

export type TimeSpan = {
  id: number;
  label: string;
  start: number;
  end?: number;
  duration?: number;
  depth?: number;
};

export type TimerHanlder = (
  duration: number,
  timeSpan: TimeSpan[],
  req: Request,
  res: Response,
) => void;
