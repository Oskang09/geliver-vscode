import React from 'react'
import ReactDOM from 'react-dom'
import App from '#/app'
import RootContext, { RootInstance } from './controller'

ReactDOM.render(
    <RootContext.Provider value={RootInstance}>
        <App />
    </RootContext.Provider>,
    document.getElementById('root')
)
