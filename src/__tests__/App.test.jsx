import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App.jsx';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const server = setupServer(
  rest.get('/api/movies', (req, res, ctx) => {
    return res(ctx.json([{ movieId: 1, title: 'Test Movie' }]));
  }),
  rest.get('/api/ratings', (req, res, ctx) => {
    return res(ctx.json([{ ratingId: 1, score: 5, movie: 'Jumanji', movieId: 1 }]))
  }),
  rest.get('/api/movies/:id', (req, res, ctx) => {
    return res(ctx.json([{ title: 'Test Movie', posterPath: '/nowhere', overview: 'pretty bad', movieId: 1 }]))
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders homepage at /', async () => {
  render(<App />)

  expect(screen.getByRole('heading', {name: /movie ratings app/i})).toBeInTheDocument()
});

describe('page navigation', () => {
  test('can navigate to all movies page', async () => {
    render(<App/>)

    const user = userEvent.setup()

    await (user.click(screen.getByText(/all movies/i)))
    
    expect(screen.getByRole('heading', {name: /all movies/i})).toBeInTheDocument()
  });

  test('can navigate to the login page', async () => {
   render(<App/>)

  const user = userEvent.setup()

  await (user.click(screen.getByText(/log in/i)))
  
  expect(screen.getByRole('heading', {name: /log in/i})).toBeInTheDocument()
});

  test('can navigate to the user ratings page', async () => {
    render(<App/>)

    const user = userEvent.setup()

    await (user.click(screen.getByText(/your ratings/i)))
    
    expect(screen.getByRole('heading', {name: /your ratings/i})).toBeInTheDocument()
  });

  test('can navigate to a movie detail page', async () => {
  render(<App/>)  

  const user = userEvent.setup()

  await (user.click(screen.getByText(/all movies/i)))

  await (user.click(screen.getByText(/test movie/i)))
  
  expect(screen.getByRole('heading', {name: /rate this movie/i})).toBeInTheDocument()
  });
});

test('logging in redirects to user ratings page', async () => {
  server.use(
    rest.post('/api/auth', (req, res ,ctx) => {
      return res(ctx.json({success: true}))
    })  
  )

  const user = userEvent.setup()

  render(<App />)

  await (user.click(screen.getByText(/log in/i)))
  await (user.type(screen.getByLabelText(/email/i), 'test@test.com'))
  await (user.type(screen.getByLabelText(/password/i), 'test'))
  await (user.click(screen.getByRole('button' ,{name: /log in/i})))

  expect(screen.getByRole('heading', {name: /your ratings/i}))
})

test('creating a rating redirects to user ratings page', async () => {
  server.use(
    rest.post('/api/ratings', (req, res, ctx) => {
      return res(ctx.json({ratingId: 1, score: 1}))
    })
  )

  render(<App />)

  const user = userEvent.setup()

  await (user.click(screen.getByText(/all movies/i)))
  await (user.click(screen.getByText(/test movie/i)))

  fireEvent.change(screen.getByRole('combobox', {name: /score/i}), {
    target: {value: '1'}
  })

  await (user.click(screen.getByRole('button', {name: /submit/i})))

  expect(screen.getByRole('heading', {name: /your ratings/i})).toBeInTheDocument()

})
