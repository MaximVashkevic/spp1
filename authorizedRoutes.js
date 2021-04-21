module.exports = (query) => !["/login", "/register"].some((path) => query.includes(path))
