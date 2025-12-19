import { render } from '@testing-library/react';
import Footer from '../../../components/Footer';

describe('Footer Integration', () => {
  it('can be imported and rendered without errors', () => {
    const { container } = render(
      <Footer copyrightText="© 2024 Test" />
    );
    expect(container.querySelector('footer')).toBeTruthy();
  });
});
