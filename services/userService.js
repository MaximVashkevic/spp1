const ValidationError = require("../validationError");
const bcrypt = require("bcryptjs");
const LoginValidator = require("../validators/loginValidator");
const RegisterValidator = require("../validators/registerValidator");

async function register(userParams) {
    const User = this.db.models.User;
    const registerValidator = RegisterValidator(userParams);
    if (!registerValidator.passes()) {
      let errorStr = [];
      const errors = registerValidator.errors.all();
      for (const errorField of Object.values(errors)) {
        for (const error of errorField) {
          errorStr.push(error);
        }
      }

      throw new ValidationError(errorStr);
    }

    const existingUser = await User.findOne({
      where: { login: userParams.login },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(
      userParams.password,
      this.config.saltLength
    );
    const user = User.create({
      login: userParams.login,
      password: passwordHash,
      amount: this.config.initialAmount,
    });
    return user.login;
}

async function logIn(userParams) {
    const User = this.db.models.User;
    const loginValidator = LoginValidator(userParams);
    if (!loginValidator.passes()) {
      throw new Error("Invalid login or password");
    }

    const user = await User.findOne({ where: { login: userParams.login } });
    if (user) {
      const passwordMathces = await bcrypt.compare(
        userParams.password,
        user.password
      );
      if (passwordMathces) {
        return user;
      }
    }
    throw new Error("Invalid login or password");
}

async function currentCash(userParams) {
    const User = this.db.models.User;
    const user = await User.findOne({where: {id: userParams.id} });
    if (user) {
        return user.amount
    }
    throw new Error("Can't get current cash")
}

module.exports = { register, logIn, currentCash }
