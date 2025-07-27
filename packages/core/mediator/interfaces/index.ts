import { MediatedRequest } from "../mediator";

export interface IPublisher {
  publish<T extends object>(event: T): Promise<void>;
}

export interface IEventHandler<T> {
  handle(event: T): Promise<void>;
}

export interface ISender {
  send<
    TReq extends MediatedRequest<TRes>,
    TRes = TReq extends MediatedRequest<infer R> ? R : never,
  >(
    req: TReq,
  ): Promise<TRes>;
}

export interface IReqHandler<T extends MediatedRequest<TResult>, TResult> {
  handle(req: T): Promise<TResult>;
}
