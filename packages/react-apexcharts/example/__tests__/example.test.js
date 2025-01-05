import React from 'react';
import Area from '../src/chart-types/Area';
import renderer from 'react-test-renderer';

// This test was solely created to confirm the svgjs undefined issue was fixed.
// The core apexcharts library test suite contains the major test cases
test('Example test to fix svgjs issues', () => {
  const component = renderer.create(
    <Area></Area>,
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});