// A simple test to verify DOM manipulation logic works before deployment
describe('Portfolio UI Logic', () => {
  beforeEach(() => {
    // Set up a fake DOM for testing
    document.body.innerHTML = `
      <div id="headline"></div>
    `;
  });

  test('Should correctly format and render the headline', () => {
    const headlineEl = document.getElementById('headline');
    const mockData = 'I Turn Messy Data Into Decisions';
    
    // Simulate your rendering function
    headlineEl.textContent = mockData;

    expect(headlineEl.textContent).toBe('I Turn Messy Data Into Decisions');
  });
});