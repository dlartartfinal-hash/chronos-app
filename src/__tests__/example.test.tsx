import React from 'react';
import { render, screen } from '@testing-library/react';
import ExampleComponent from '../ExampleComponent';

test('renders example component', () => {
	render(<ExampleComponent />);
	const linkElement = screen.getByText(/example/i);
	expect(linkElement).toBeInTheDocument();
});