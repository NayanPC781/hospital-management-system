import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="ui-page-header">
    <div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    {actions ? <div className="ui-page-actions">{actions}</div> : null}
  </div>
);

export default PageHeader;
