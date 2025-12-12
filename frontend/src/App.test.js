import { render, screen } from '@testing-library/react';
import App from './App';

test('renders project information header', () => {
  render(<App />);
  // We search for text that actually exists in your App.js
  const linkElement = screen.getByText(/Project Information/i);
  expect(linkElement).toBeInTheDocument();
});