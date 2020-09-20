import { BehaviorSubject } from 'rxjs'

export type Stateful<T> = BehaviorSubject<T>

export class Atom<T> extends BehaviorSubject<T> implements Stateful<T> {
  static of<T>(initialValue: T): Atom<T> {
    return new Atom(initialValue)
  }
}
