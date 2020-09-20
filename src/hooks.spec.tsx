import { act, renderHook } from '@testing-library/react-hooks'
import { combineLatest, from } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { Atom } from './atom'
import { useObservableValue, useStateful } from './hooks'

describe('useObservableValue', () => {
  it('gets value from atom', () => {
    const ValueAtom = Atom.of<string>('Adam')
    const { result } = renderHook(() => useObservableValue(ValueAtom))

    expect(result.current).toEqual('Adam')
  })

  it('gets value from observable', () => {
    const ValueAtom = Atom.of<string>('Adam')
    const uppercaseSelector = ValueAtom.pipe(map((value) => value.toUpperCase()))

    const { result } = renderHook(() => useObservableValue(uppercaseSelector))
    expect(result.current).toEqual('ADAM')
  })

  it('gets value from merged atoms', () => {
    const FirstNameAtom = Atom.of<string>('Adam')
    const LastNameAtom = Atom.of<string>('Zima')
    const nameSelector = combineLatest([FirstNameAtom, LastNameAtom]).pipe(
      map(([first, last]) => `${first} ${last}`)
    )

    const { result } = renderHook(() => useObservableValue(nameSelector))
    expect(result.current).toEqual('Adam Zima')
  })

  it('gets value from async observable', async () => {
    const ValueAtom = Atom.of<string>('Adam')
    const fetchUserData = (name: string) => Promise.resolve({ firstName: name, lastName: 'Zima' })
    const asyncSelector = ValueAtom.pipe(switchMap((value) => from(fetchUserData(value))))

    const { result, waitForNextUpdate } = renderHook(() => useObservableValue(asyncSelector))
    await waitForNextUpdate()
    expect(result.current).toEqual({ firstName: 'Adam', lastName: 'Zima' })
  })

  it('unsubscribes from updates when unmounted', () => {
    const ValueAtom = Atom.of<string>('Adam')

    const { unmount } = renderHook(() => useObservableValue(ValueAtom))
    expect(ValueAtom.observers).toHaveLength(1)
    unmount()
    expect(ValueAtom.observers).toHaveLength(0)
  })
})

describe('useAtom', () => {
  it('gets and sets atom value', () => {
    const ValueAtom = Atom.of<string>('Adam')
    const { result } = renderHook(() => useStateful(ValueAtom))

    const [value, updateValue] = result.current
    expect(value).toEqual('Adam')

    act(() => {
      updateValue('Beata')
    })

    const [newValue] = result.current
    expect(newValue).toEqual('Beata')
  })

  it('sets value with updater function', () => {
    const ValueAtom = Atom.of<string>('Adam')
    const { result } = renderHook(() => useStateful(ValueAtom))

    const [, updateValue] = result.current

    act(() => {
      updateValue((value) => value.toUpperCase())
    })

    const [newValue] = result.current
    expect(newValue).toEqual('ADAM')
  })
})
