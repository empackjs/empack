export type OkResult<T> = {
  isSuccess: true;
  data: T;
};

export type ErrorResult<E> = {
  isSuccess: false;
  error: E;
};

export type OneOf<T, E> = OkResult<T> | ErrorResult<E>;
