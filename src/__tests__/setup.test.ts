describe('Jest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing library', () => {
    expect(typeof expect).toBe('function');
  });
});