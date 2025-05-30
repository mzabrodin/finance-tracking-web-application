import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders login page by default', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const loginTitle = screen.getByText(/Логін/i);
  expect(loginTitle).toBeInTheDocument();
});