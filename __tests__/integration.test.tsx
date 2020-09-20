import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { of } from 'ramda'
import * as React from 'react'
import { useEffect } from 'react'
import {
  QueryConfig,
  QueryKey,
  QueryResult,
  QueryStatus,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
  useQuery,
} from 'react-query'
import { from } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'

import { Atom, Stateful, useObservableValue, useStateful } from '../src'

type User = {
  id: number
  firstName: string
  lastName: string
}

const UsersDb: User[] = [
  { id: 1, firstName: 'Adam', lastName: 'Zima' },
  { id: 2, firstName: 'Beata', lastName: 'Obrok' },
]

const fetchUser = (id: number): Promise<User> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = UsersDb.find((user) => user.id === id)
      if (user) resolve(user)
      else reject(new Error('User not found'))
    }, 1)
  })

describe('hooks', () => {
  const UserIdAtom = Atom.of<number>(1)
  const currentUserSelector = UserIdAtom.pipe(
    switchMap((id) =>
      from(fetchUser(id)).pipe(
        map((user) => ({ status: 'success', user, error: null })),
        catchError((err) => of({ status: 'error', error: err, user: null }))
      )
    )
  )

  const TestComponent = () => {
    const [currentUserId, updateUserId] = useStateful(UserIdAtom)
    const { status, error, user } = useObservableValue(currentUserSelector, {
      status: 'loading',
      error: null,
      user: null,
    })

    if (status === 'loading') return <p>Loading...</p>

    const greeting = status === 'success' && (
      <p>
        Hi {user?.firstName} {user?.lastName}
      </p>
    )
    const errorMessage = status === 'error' && <p>Error fetching user: {error.message}</p>

    return (
      <div>
        {greeting}
        {errorMessage}

        <label htmlFor="user-id">User Id</label>
        <input
          id="user-id"
          type="text"
          value={currentUserId}
          onChange={(e) => updateUserId(parseInt(e.target.value, 10))}
        />
      </div>
    )
  }

  it('updates component based on atom value', async () => {
    const { getByText, getByLabelText } = render(<TestComponent />)

    expect(getByText('Loading...')).toBeInTheDocument()
    await waitFor(() => {
      expect(getByText('Hi Adam Zima')).toBeInTheDocument()
    })

    userEvent.type(getByLabelText('User Id'), '3')
    await waitFor(() => {
      expect(getByText('Error fetching user: User not found')).toBeInTheDocument()
    })

    userEvent.type(getByLabelText('User Id'), '{selectall}2')
    await waitFor(() => {
      expect(getByText('Hi Beata Obrok')).toBeInTheDocument()
    })
  })
})

describe('with external query', () => {
  type AuthContext = {
    data?: User
    status?: QueryStatus
    error?: Error | null
  }
  const AuthResponseAtom = Atom.of<AuthContext>({ status: 'idle' as QueryStatus })
  const Auth$ = AuthResponseAtom.pipe(
    map(({ status, error, data }) => ({
      status,
      error,
      user: data
        ? {
            ...data,
            name: `${data?.firstName} ${data?.lastName}`,
          }
        : null,
    }))
  )

  const useStatefulQuery = <TRes, TArgs extends TypedQueryFunctionArgs, TErr extends Error>(
    stateful: Stateful<Partial<QueryResult<TRes, TErr>>>,
    key: QueryKey,
    query: TypedQueryFunction<TRes, TArgs>,
    options?: QueryConfig<TRes, TErr>
  ) => {
    const [state, nextState] = useStateful(stateful)
    const queryResult = useQuery(key, query, options)

    useEffect(() => {
      nextState(queryResult)
    }, [queryResult])

    return state
  }

  const useAuth = () => {
    useStatefulQuery(AuthResponseAtom, 'user', () => fetchUser(1))
    return useObservableValue(Auth$, { status: 'idle' as QueryStatus, user: null, error: null })
  }

  const TestComponent = () => {
    const { status, error, user } = useAuth()

    if (status === 'loading') return <p>Loading...</p>
    if (status === 'error') return <p>Error fetching user: {error?.message}</p>

    return (
      <div>
        <p>
          Hi {user?.firstName} {user?.lastName}
        </p>
      </div>
    )
  }

  it('updates component based on atom value', async () => {
    const { getByText, getByLabelText } = render(<TestComponent />)

    expect(getByText('Loading...')).toBeInTheDocument()
    await waitFor(() => {
      expect(getByText('Hi Adam Zima')).toBeInTheDocument()
    })
  })
})
