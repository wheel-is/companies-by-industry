export const nodes = [
    { id: 'investor1', type: 'investor', size: 100, color: 'red', aum: 1000 },
    { id: 'investor2', type: 'investor', size: 150, color: 'red', aum: 1500 },
    { id: 'investor3', type: 'investor', size: 200, color: 'red', aum: 2000 },
    { id: 'investor4', type: 'investor', size: 180, color: 'red', aum: 1800 },
    { id: 'investor5', type: 'investor', size: 220, color: 'red', aum: 2200 },
    { id: 'startup1', type: 'startup', size: 250, color: 'blue', marketCap: 2500 },
    { id: 'startup2', type: 'startup', size: 300, color: 'blue', marketCap: 3000 },
    { id: 'startup3', type: 'startup', size: 180, color: 'blue', marketCap: 1800 },
    { id: 'startup4', type: 'startup', size: 220, color: 'blue', marketCap: 2200 },
    { id: 'startup5', type: 'startup', size: 270, color: 'blue', marketCap: 2700 },
    // Add more nodes here
    { id: 'investor6', type: 'investor', size: 170, color: 'red', aum: 1700 },
    { id: 'investor7', type: 'investor', size: 190, color: 'red', aum: 1900 },
    { id: 'startup6', type: 'startup', size: 280, color: 'blue', marketCap: 2800 },
    { id: 'startup7', type: 'startup', size: 320, color: 'blue', marketCap: 3200 },
  ];
  
  export const links = [
    { source: 'investor1', target: 'startup1', value: 100, date: '2022-01-01' },
    { source: 'investor2', target: 'startup1', value: 200, date: '2023-01-01' },
    { source: 'investor3', target: 'startup2', value: 300, date: '2024-01-01' },
    { source: 'investor3', target: 'startup1', value: 300, date: '2020-01-01' },
    { source: 'investor1', target: 'startup3', value: 150, date: '2023-06-01' },
    { source: 'investor2', target: 'startup2', value: 250, date: '2024-06-01' },
    { source: 'investor4', target: 'startup4', value: 180, date: '2021-05-15' },
    { source: 'investor5', target: 'startup5', value: 220, date: '2022-07-21' },
    { source: 'investor4', target: 'startup2', value: 200, date: '2023-08-12' },
    { source: 'investor5', target: 'startup3', value: 250, date: '2022-09-05' },
    { source: 'investor1', target: 'startup4', value: 100, date: '2023-11-01' },
    { source: 'investor2', target: 'startup3', value: 150, date: '2021-12-01' },
    { source: 'investor3', target: 'startup5', value: 180, date: '2024-02-01' },
    { source: 'investor4', target: 'startup1', value: 220, date: '2020-03-15' },
    { source: 'investor5', target: 'startup2', value: 250, date: '2021-04-20' },
    // Add more links here
    { source: 'investor6', target: 'startup6', value: 210, date: '2022-08-10' },
    { source: 'investor7', target: 'startup7', value: 280, date: '2023-09-15' },
  ];
  