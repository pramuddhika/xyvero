/* eslint-disable prettier/prettier */
import React from 'react'

function Categories(): React.JSX.Element {
  return (
    <section className="content-area categories-page">
      <div className="categories-toolbar">
        <div className="categories-copy">
          <h2>Categories</h2>
          <p>Manage income and expense categories.</p>
        </div>

        <button type="button" className="category-add-button">
          <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
            <path
              d="M10 4v12M4 10h12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span>Add new</span>
        </button>
      </div>

      <div className="category-accordions">
        <details className="category-accordion">
          <summary>Income category</summary>
          <div className="category-accordion-body">
            <p>Income categories will be listed here.</p>
          </div>
        </details>

        <details className="category-accordion">
          <summary>Expense category</summary>
          <div className="category-accordion-body">
            <p>Expense categories will be listed here.</p>
          </div>
        </details>
      </div>
    </section>
  )
}

export default Categories
