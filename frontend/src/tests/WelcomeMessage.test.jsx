import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// A mock component to test
const WelcomeMessage = ({ name }) => (
  <div>
    <h1>Welcome, {name}!</h1>
    <p>We are glad to have you here.</p>
  </div>
);

describe('WelcomeMessage Component', () => {
  it('renders the welcome message with the correct name', () => {
    // 1. Render the component in a virtual DOM
    render(<WelcomeMessage name="John Doe" />);

    // 2. Query the DOM for specific elements
    const headingElement = screen.getByText('Welcome, John Doe!');
    const paragraphElement = screen.getByText(/glad to have you/i);

    // 3. Make assertions to ensure they are in the document
    expect(headingElement).toBeDefined();
    expect(paragraphElement).toBeDefined();
  });
});
