import React from 'react';
import renderer from 'react-test-renderer';
import SpotCard from './SpotCard';
import type {Spot, WeatherData} from '../api/types';

const spot: Spot = {id: 1, name: 'Kiel Fjord', lat: 54.3233, lon: 10.1228};

const weather: WeatherData = {
  time: '2026-05-29T14:00:00Z',
  temp: 19,
  windSpeed: 22,
  windDirection: 225,
  windGusts: 31,
  cloudCover: 15,
  precipitation: 0,
  weatherCode: 1,
  waveHeight: 0.4,
  isGood: true,
  daily: [],
};

function flatten(node: any, out: string[] = []): string[] {
  if (node == null) return out;
  if (typeof node === 'string') {
    out.push(node);
  } else if (Array.isArray(node)) {
    node.forEach(c => flatten(c, out));
  } else if (node.children) {
    flatten(node.children, out);
  }
  return out;
}

describe('SpotCard', () => {
  it('renders the spot name and formatted coordinates', () => {
    const tree = renderer.create(<SpotCard spot={spot} weather={weather} />).toJSON();
    const text = flatten(tree).join(' ');
    expect(text).toContain('Kiel Fjord');
    expect(text).toContain('54.323');
  });

  it('shows the Sailable badge when conditions are good', () => {
    const tree = renderer.create(<SpotCard spot={spot} weather={weather} />).toJSON();
    expect(flatten(tree).join(' ')).toContain('Sailable');
  });

  it('shows the No go badge when conditions are bad', () => {
    const tree = renderer
      .create(<SpotCard spot={spot} weather={{...weather, isGood: false}} />)
      .toJSON();
    expect(flatten(tree).join(' ')).toContain('No go');
  });
});
