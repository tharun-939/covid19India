const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbpath = path.join(__dirname, 'covid19India.db')
let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

app.get('/states/', async (request, response) => {
  const covidStateQuery = `SELECT * FROM state;`
  const covidStateDetails = await db.all(covidStateQuery)
  response.send(
    covidStateDetails.map(eachState => ({
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    })),
  )
})

function convertStateDb(stateDb) {
  return {
    stateId: stateDb.state_id,
    stateName: stateDb.state_name,
    population: stateDb.population,
  }
}

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params;
  const stateQuery = `
  SELECT * FROM state
  WHERE state_id = ${stateId};`
  const stateDb = await db.get(stateQuery)
  response.send(convertStateDb(stateDb))
})


module.exports = app
