import { createRef, useCallback, useEffect, useMemo, useState } from "react";
import cn from "classnames";

import { ORDER_FILTERS } from '../../utils';

import "./App.css";

type Wine = {
  id: number;
  full_name:string;
  revenue:number;
  sold_bottles:number;
  order_coun:number;
}

type Order = keyof typeof ORDER_FILTERS;

const API_URL = 'http://localhost:3000';

const ORDER_LABELS: Record<Order, string> = {
  REVENUE: 'By revenue',
  QUANTITY: 'By # bottles sold',
  ORDERS: 'By # orders',
}

const pounds = Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'GBP',
});

// Debounce function
const debounce = (func: () => void, delay = 1000) => {
  let timer: number;
  return (...args: []) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

function App() {
  const [wineList, setWineList] = useState<Wine[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order>('REVENUE');
  const [search, setSearch] = useState<string>();
  const listLength = useMemo(() => wineList.length, [wineList]);
  const tenPercent = useMemo(() => Math.ceil(listLength / 10), [listLength]);
  const searchRef = createRef<HTMLInputElement>();

  const setOrder = (order: Order) => () => {
    setSelectedOrder(() => order)
  };

  useEffect(() => {
    const searchQuery = search ? `&search=${search}` : '';
    fetch(`${API_URL}/best_selling_wines?orderBy=${selectedOrder}${searchQuery}`)
      .then((response) => response.json())
      .then((data) => {
        setWineList(() => data.items);
      });
  }, [selectedOrder, search]);

  const onInputChange = debounce(() => {
    setSearch(() => searchRef.current?.value || '');
  });

  const onClearSearch = useCallback(() => {
    searchRef.current!.value = '';
    setSearch(() => undefined)
  }, [searchRef]);

  return <main>
    <h1>Best selling wine</h1>
    <section className="filters">
      <div>
        <input ref={searchRef} type="search" name="search" id="search" onChange={onInputChange} placeholder="search..." />
      </div>
      <div>
        {(Object.entries(ORDER_LABELS) as [Order, string][]).map(([key, text]) => (
          <button
            key={`button-${key}`}
            type="button"
            onClick={setOrder(key)}
            className={cn({ active: selectedOrder === key })}
          >
            {text}
          </button>
        ))}
      </div>
    </section>
    {listLength > 0
      ? (
        <ol className="wine-list">
          {wineList.map(({id, full_name, revenue}: Wine, index) => (
              <li
                key={id}
                className={cn({
                  'top-higher': index < tenPercent,
                  'top-lower': tenPercent > listLength - (index + 1),
                })}
              >
                {full_name} - {pounds.format(revenue)}
              </li>
          ))}
        </ol>
      ) : (
        <p>
          No results for the given search.{' '}
          <button className="link" onClick={onClearSearch}>Click here</button>{' '}
          to clear it.
        </p>
      )
    }
  </main>
  
}

export default App;
