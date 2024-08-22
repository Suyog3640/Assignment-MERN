import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('March');
  const [stats, setStats] = useState({ totalAmount: 0, totalSold: 0, totalNotSold: 0 });
  const [chartData, setChartData] = useState([]);

  //Calculating number of pages
  const numberOfPages = Math.ceil(records / perPage);

  function LoadData() {
    //Loading data for getting length
    axios.get(`http://localhost:4000/api/transactions`)
    .then((response) => {
      setRecords(response.data.total);
    });

    //Loading data according to given perPage and page
    axios.get(`http://localhost:4000/api/transactions?search=${search}&month=${month}&page=${page}&perPage=${perPage}`)
    .then((response) => {
      setData(response.data.transactions);
    });

    //Loading statistics according to given perPage and page
    axios.get(`http://localhost:4000/api/statistics?month=${month}`)
    .then((response) => {
      setStats(response.data);
    });

    //Loading price range statistics according to given perPage and page
    axios.get(`http://localhost:4000/api/price-range-stats?month=${month}`)
    .then((response) => {
      setChartData(response.data);
    });
  }

  //logic for getting next page in pagination
  function prev() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function next() {
    if (page < numberOfPages) {
      setPage(page + 1);
    }
  }

  //loading transactions
  useEffect(() => {
    LoadData();
  }, [page, perPage, search, month]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between mt-5 mb-5">
        <div className="">
          <input className="form-control bg-warning border-black" type='search' placeholder="Search transaction" aria-label="Search" value={search} onChange={(e)=>{setSearch(e.target.value)}} />
        </div>
          {/* Dropdown for month */}
          <select className="btn bg-warning border-black" value={month} onChange={(e)=> setMonth(e.target.value)}>
            <option value=''>Select Month</option>
            <option value='January'>January</option>
            <option value='February'>February</option>
            <option value='March'>March</option>
            <option value='April'>April</option>
            <option value='May'>May</option>
            <option value='June'>June</option>
            <option value='July'>July</option>
            <option value='August'>August</option>
            <option value='September'>September</option>
            <option value='October'>October</option>
            <option value='November'>November</option>
            <option value='December'>December</option>
          </select>
      </div>
      {/* Table to display data */}
      <table className="table table-bordered border-black table-hover table-responsive table-warning">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {
            data.length > 0 ? 
            data.map(transaction =>
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.title}</td>
                <td>{transaction.description}</td>
                <td>{transaction.price}</td>
                <td>{transaction.category}</td>
                <td>{transaction.sold ? 'True' : 'False'}</td>
                <td><img src={transaction.image} width="50" height="50" alt='' /></td>
              </tr>
            )
            :
            <tr>
                <td className='fw-bold'>No Record Found!</td>
            </tr>
          }
        </tbody>
      </table>
      {/* Pagination buttons */}
      <div>
        <ul className='d-flex justify-content-between gap-2 list-unstyled'>
          <li className='fw-bold'>
            Page No : {page}
          </li>
          <div className='d-flex gap-3'>
            <li>
              <button className='btn border-black bg-warning' onClick={prev}>Prev</button>
            </li>
            <li>
              <button className='btn border-black bg-warning' onClick={next}>Next</button>
            </li>
          </div>
          <li className='fw-bold'>
            Per Page: {perPage}
          </li>
        </ul>
      </div>
      <div className='d-flex justify-content-between mt-5'>
        <div className='w-25'>
          {/* Transaction Statistics */}
          {
            month==='' ? '' :
            <div className='bg-warning card mb-5 pt-4'>
              <div className='d-flex justify-content-around'>
                <div>
                  <h5>Total Sales</h5>
                  <h5>Total Sold Items</h5>
                  <h5>Total Not Sold Items</h5>
                </div>
                <div>
                  <p className='mb-2'>{stats.totalSaleAmount}</p>
                  <p className='mb-2'>{stats.totalSoldItems}</p>
                  <p>{stats.totalNotSoldItems}</p>
                </div>
              </div>
            </div> 
          }
        </div>
        <div className='w-50'>
          {/* Transaction Bar Chart */}
          {
            month==='' ? '' :
            <div className="container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priceRange" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ffc107" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
