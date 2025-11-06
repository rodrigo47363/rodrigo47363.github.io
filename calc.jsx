import React, { useEffect, useState } from 'react';
// BTC Projection single-file React component (Tailwind + Recharts)
// Default export a component you can drop into a CRA/Vite app.
// Requirements: tailwindcss installed, recharts installed (npm i recharts), framer-motion optional.

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function BTCProjectionApp() {
  // --- Input state ---
  const [income, setIncome] = useState(12000);
  const [phoneMonthly, setPhoneMonthly] = useState(604);
  const [hygieneAndSupport, setHygieneAndSupport] = useState(1600);
  const [extras, setExtras] = useState(300);
  const [scooterCost, setScooterCost] = useState(10000);
  const [scooterMonthly, setScooterMonthly] = useState(640);
  const [scooterMaintenance, setScooterMaintenance] = useState(100);
  const [uberMonthCost, setUberMonthCost] = useState(3696); // months 1-2
  const [buyFrequency, setBuyFrequency] = useState('monthly');
  const [annualReturn, setAnnualReturn] = useState(0.40);
  const [inflation, setInflation] = useState(0.05);
  const [months, setMonths] = useState(48);

  // runtime state
  const [currentBtcPrice, setCurrentBtcPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [data, setData] = useState([]);

  // fetch current BTC price in MXN from CoinGecko
  async function fetchBtcPrice() {
    try {
      setLoadingPrice(true);
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=mxn');
      const j = await r.json();
      if (j && j.bitcoin && j.bitcoin.mxn) {
        setCurrentBtcPrice(j.bitcoin.mxn);
      }
    } catch (e) {
      console.error('CoinGecko fetch error', e);
      setCurrentBtcPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  }

  useEffect(() => {
    fetchBtcPrice();
  }, []);

  // main simulation
  function runSimulation() {
    if (!currentBtcPrice) {
      alert('Aún no está disponible el precio BTC. Intenta recargar precio.');
      return;
    }

    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const monthlyInflation = Math.pow(1 + inflation, 1 / 12) - 1;

    let rows = [];
    let btcAccum = 0;
    let btcPrice = currentBtcPrice;

    for (let m = 1; m <= months; m++) {
      // determine transport cost logic
      let transportCost = 0;
      if (m <= 2) transportCost = uberMonthCost;
      else if (m === 3) transportCost = scooterCost; // purchase month
      else if (m > 3 && m <= 24) transportCost = scooterMonthly; // amortization period
      else transportCost = scooterMaintenance; // afterwards

      const phoneCost = m <= 12 ? phoneMonthly : 0;
      const totalExpenses = transportCost + phoneCost + hygieneAndSupport + extras;
      const invest = Math.max(0, income - totalExpenses);

      // btc bought that month
      const btcBought = invest / btcPrice;
      btcAccum += btcBought;

      const portfolioValue = btcAccum * btcPrice;

      rows.push({
        month: m,
        income,
        transportCost,
        phoneCost,
        hygieneAndSupport,
        extras,
        totalExpenses,
        invest,
        btcBought,
        btcAccum,
        btcPrice: Math.round(btcPrice),
        portfolioValue: Math.round(portfolioValue)
      });

      // update btc price for next month
      btcPrice *= 1 + monthlyReturn;
    }

    setData(rows);
  }

  function downloadCSV() {
    if (!data.length) return;
    const header = Object.keys(data[0]).join(',');
    const csv = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([header + '\n' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'btc_projection.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Proyección BTC — Simulador realista</h1>
        <p className="text-sm text-gray-600 mb-4">Usa la API pública de CoinGecko para precio actual BTC (MXN). Ajusta parámetros y pulsa <span className="font-semibold">Run simulation</span>.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Ingreso mensual (MXN)</label>
            <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Teléfono (mensual, 12 meses)</label>
            <input type="number" value={phoneMonthly} onChange={e => setPhoneMonthly(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Higiene + apoyo casa (mensual)</label>
            <input type="number" value={hygieneAndSupport} onChange={e => setHygieneAndSupport(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Gastos extras (mensual)</label>
            <input type="number" value={extras} onChange={e => setExtras(Number(e.target.value))} className="w-full p-2 border rounded" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500">Scooter (compra única)</label>
            <input type="number" value={scooterCost} onChange={e => setScooterCost(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Scooter mensual (amortización)</label>
            <input type="number" value={scooterMonthly} onChange={e => setScooterMonthly(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Scooter mantenimiento (post-amortización)</label>
            <input type="number" value={scooterMaintenance} onChange={e => setScooterMaintenance(Number(e.target.value))} className="w-full p-2 border rounded" />

            <label className="text-xs text-gray-500">Uber mensual (meses 1–2)</label>
            <input type="number" value={uberMonthCost} onChange={e => setUberMonthCost(Number(e.target.value))} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500">Rendimiento anual BTC (%)</label>
            <input type="number" value={annualReturn * 100} onChange={e => setAnnualReturn(Number(e.target.value) / 100)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Inflación anual (%)</label>
            <input type="number" value={inflation * 100} onChange={e => setInflation(Number(e.target.value) / 100)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Meses (horizonte)</label>
            <select value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full p-2 border rounded">
              <option value={36}>36 (3 años)</option>
              <option value={48}>48 (4 años)</option>
              <option value={60}>60 (5 años)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={fetchBtcPrice} className="px-4 py-2 bg-gray-200 rounded">Recargar precio BTC</button>
          <button onClick={runSimulation} className="px-4 py-2 bg-blue-600 text-white rounded">Run simulation</button>
          <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded">Descargar CSV</button>
          <div className="ml-auto text-sm text-gray-600">Precio BTC actual: {loadingPrice ? 'Cargando...' : (currentBtcPrice ? `MXN ${currentBtcPrice.toLocaleString()}` : 'No disponible')}</div>
        </div>

        {data.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Resumen</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-xs text-gray-500">BTC acumulado (último mes)</div>
                <div className="text-xl font-bold">{data[data.length - 1].btcAccum.toFixed(6)} BTC</div>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-xs text-gray-500">Valor portfolio (último mes)</div>
                <div className="text-xl font-bold">MXN {data[data.length - 1].portfolioValue.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-xs text-gray-500">Total invertido (suma inversiones)</div>
                <div className="text-xl font-bold">MXN {data.reduce((s, r) => s + r.invest, 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="portfolioValue" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Mes</th>
                    <th className="p-2 border">Ingresos</th>
                    <th className="p-2 border">Gastos</th>
                    <th className="p-2 border">Invertido</th>
                    <th className="p-2 border">BTC comprado</th>
                    <th className="p-2 border">BTC acumulado</th>
                    <th className="p-2 border">Precio BTC</th>
                    <th className="p-2 border">Valor portafolio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.month}>
                      <td className="p-2 border text-center">{row.month}</td>
                      <td className="p-2 border text-right">{row.income.toLocaleString()}</td>
                      <td className="p-2 border text-right">{row.totalExpenses.toLocaleString()}</td>
                      <td className="p-2 border text-right">{row.invest.toLocaleString()}</td>
                      <td className="p-2 border text-right">{row.btcBought.toFixed(6)}</td>
                      <td className="p-2 border text-right">{row.btcAccum.toFixed(6)}</td>
                      <td className="p-2 border text-right">{row.btcPrice.toLocaleString()}</td>
                      <td className="p-2 border text-right">{row.portfolioValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <div className="max-w-4xl mx-auto mt-6 text-xs text-gray-500">
        <p>Nota: La API pública de CoinGecko tiene límite de requests. Ajusta el horizonte y la frecuencia si usas la app intensivamente.</p>
      </div>
    </div>
  );
}
