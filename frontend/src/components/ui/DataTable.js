import React from 'react';

const DataTable = ({ headers, children }) => (
  <div className="card ui-table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export default DataTable;
