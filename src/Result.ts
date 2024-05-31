export type ResultOk<T> = [T, null]
export type ResultErr<E> = [null, E]
export type Result<T, E> = ResultOk<T> | ResultErr<E>
