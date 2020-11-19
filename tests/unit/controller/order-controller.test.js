import {
  HTTP_BAD_REQUEST_400,
  HTTP_OK_200,
  HTTP_CREATED_201,
  HTTP_SERVER_ERROR_500,
} from '../../../src/domain/helpers/http-helper';
import OrderController from '../../../src/domain/controllers/order-controller';

const makeRepository = () => {
  class RepositoryStub {
    async retriveByCpf(cpf) {
      return {
        email: 'valid_email@email.com',
        cpf,
        tid: '2134534253252',
        delivered: false,
      };
    }
    async create(data) {
      return {
        _id: 1,
        email: 'valid_email@email.com',
        cpf: '12345612312',
        tid: '2134534253252',
        delivered: false,
      };
    }
    async update(query) {
      return {
        _id: 1,
        email: 'valid_email@email.com',
        cpf: '12345612312',
        tid: '2134534253252',
        delivered: true,
      };
    }
  }

  return new RepositoryStub();
};

const makeCpfValidator = () => {
  class ValidarCpfStub {
    validate(cpf) {
      return true;
    }
  }
  return new ValidarCpfStub();
};

const makePaymentAdapter = () => {
  class PaymentAdapterStub {
    pay(paymentData) {
      return 'transaction_id';
    }
  }
  return new PaymentAdapterStub();
};

const makeSut = () => {
  const repositoryStub = makeRepository();
  const cpfValidatorStub = makeCpfValidator();
  const paymentAdapterStub = makePaymentAdapter();
  const sut = new OrderController(
    repositoryStub,
    cpfValidatorStub,
    paymentAdapterStub
  );
  return { sut, repositoryStub, cpfValidatorStub, paymentAdapterStub };
};

const makeFakePaymentData = () => ({
  orderPrice: 10,
  orderReference: Math.floor(Math.random() * 10001),
  cardNumber: '5448280000000007',
  cvv: '235',
  expirationMonth: '12',
  expirationYear: '2020',
  cardHolderName: 'Fulano de Tal',
});

const makeFakeRequest = () => ({
  email: 'valid_email@email.com',
  cpf: '12345612312',
  tid: '2134534253252',
  delivered: false,
});

const makeFakeOrder = () => ({
  _id: 1,
  email: 'valid_email@email.com',
  cpf: '12345612312',
  tid: '2134534253252',
  delivered: false,
});

describe('Order controller', () => {
  it('It must load an order with 200 status code', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      cpf: '12345612312',
    };
    const httpResponse = await sut.retrieveOrder(httpRequest);
    expect(httpResponse).toEqual(HTTP_OK_200(makeFakeRequest()));
  });

  it('must call ValidarCPF with correct data', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    const cpfValidatorSpy = jest.spyOn(cpfValidatorStub, 'validate');
    const httpRequest = {
      cpf: '12345612312',
    };
    await sut.retrieveOrder(httpRequest);
    expect(cpfValidatorSpy).toHaveBeenCalledWith(httpRequest.cpf);
  });

  it('It must return 500 if ValidarCPF throws an error', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    jest
      .spyOn(cpfValidatorStub, 'validate')
      .mockImplementationOnce(new Error());
    const httpRequest = {
      cpf: '12345612312',
    };
    const httpResponse = await sut.retrieveOrder(httpRequest);
    expect(httpResponse).toEqual(HTTP_SERVER_ERROR_500(new Error()));
  });

  it('it must return 400 status code if ValidarCPF returns false', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    jest.spyOn(cpfValidatorStub, 'validate').mockReturnValueOnce(false);
    const httpRequest = {
      cpf: '12345612312',
    };
    const httpResponse = await sut.retrieveOrder(httpRequest);
    expect(httpResponse).toEqual(
      HTTP_BAD_REQUEST_400({ message: 'Invalid param: cpf' })
    );
  });

  it('It must return an error message and 400 status code if order is not found', async () => {
    const { sut, repositoryStub } = makeSut();
    jest.spyOn(repositoryStub, 'retriveByCpf').mockReturnValueOnce(null);
    const httpRequest = {
      cpf: '26306359028',
    };
    const httpResponse = await sut.retrieveOrder(httpRequest);
    expect(httpResponse).toEqual(
      HTTP_BAD_REQUEST_400({ message: 'No orders were found' })
    );
  });

  it('It must call Repository with correct value', async () => {
    const { sut, repositoryStub } = makeSut();
    const repositorySpy = jest.spyOn(repositoryStub, 'retriveByCpf');
    const httpRequest = {
      cpf: '26306359028',
    };
    await sut.retrieveOrder(httpRequest);
    expect(repositorySpy).toHaveBeenCalledWith(httpRequest.cpf);
  });

  it('It must return 500 if retriveByCpf throws an error', async () => {
    const { sut, repositoryStub } = makeSut();
    jest
      .spyOn(repositoryStub, 'retriveByCpf')
      .mockImplementationOnce(new Error());
    const httpRequest = {
      cpf: '26306359028',
    };
    const httpResponse = await sut.retrieveOrder(httpRequest);
    expect(httpResponse).toEqual(HTTP_SERVER_ERROR_500(new Error()));
  });

  it('must call PaymentAdapter with correct data', async () => {
    const { sut, paymentAdapterStub } = makeSut();
    const paySpy = jest.spyOn(paymentAdapterStub, 'pay');
    const orderData = {
      email: 'valid_email@email.com',
      cpf: '12345612312',
      delivered: false,
    };
    const paymentData = {
      orderPrice: 10,
      orderReference: Math.floor(Math.random() * 10001),
      cardNumber: '5448280000000007',
      cvv: '235',
      expirationMonth: '12',
      expirationYear: '2020',
      cardHolderName: 'Fulano de Tal',
    };
    const httpRequest = {
      orderData,
      paymentData,
    };
    await sut.createOrder(httpRequest);
    expect(paySpy).toHaveBeenCalledWith(paymentData);
  });

  it('it must create an order with 201 status code given valid data', async () => {
    const { sut } = makeSut();
    const orderData = {
      email: 'valid_email@email.com',
      cpf: '12345612312',
      delivered: false,
    };
    const paymentData = {
      orderPrice: 10,
      orderReference: Math.floor(Math.random() * 10001),
      cardNumber: '5448280000000007',
      cvv: '235',
      expirationMonth: '12',
      expirationYear: '2020',
      cardHolderName: 'Fulano de Tal',
    };
    const httpRequest = {
      orderData,
      paymentData,
    };
    const httpResponse = await sut.createOrder(httpRequest);
    expect(httpResponse).toEqual(HTTP_CREATED_201(makeFakeOrder()));
  });

  it('must call ValidarCPF with correct data', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    const cpfValidatorSpy = jest.spyOn(cpfValidatorStub, 'validate');
    const orderData = {
      email: 'valid_email@email.com',
      cpf: '12345612312',
      delivered: false,
    };
    const paymentData = {
      orderPrice: 10,
      orderReference: Math.floor(Math.random() * 10001),
      cardNumber: '5448280000000007',
      cvv: '235',
      expirationMonth: '12',
      expirationYear: '2020',
      cardHolderName: 'Fulano de Tal',
    };
    const httpRequest = {
      orderData,
      paymentData,
    };
    await sut.createOrder(httpRequest);
    expect(cpfValidatorSpy).toHaveBeenCalledWith(orderData.cpf);
  });

  it('It must return 500 if ValidarCPF throws an error', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    jest
      .spyOn(cpfValidatorStub, 'validate')
      .mockImplementationOnce(new Error());
    const httpResponse = await sut.createOrder(makeFakeRequest());
    expect(httpResponse).toEqual(HTTP_SERVER_ERROR_500(new Error()));
  });

  it('it must return 400 status code if ValidarCPF returns false', async () => {
    const { sut, cpfValidatorStub } = makeSut();
    jest.spyOn(cpfValidatorStub, 'validate').mockReturnValueOnce(false);
    const orderData = {
      email: 'valid_email@email.com',
      cpf: '12345612312',
      delivered: false,
    };
    const paymentData = {
      orderPrice: 10,
      orderReference: Math.floor(Math.random() * 10001),
      cardNumber: '5448280000000007',
      cvv: '235',
      expirationMonth: '12',
      expirationYear: '2020',
      cardHolderName: 'Fulano de Tal',
    };
    const httpRequest = {
      orderData,
      paymentData,
    };
    const httpResponse = await sut.createOrder(httpRequest);
    expect(httpResponse).toEqual(
      HTTP_BAD_REQUEST_400({ message: 'Invalid param: cpf' })
    );
  });

  it('it must call Repository with correct order value', async () => {
    const { sut, repositoryStub } = makeSut();
    const repositorySpy = jest.spyOn(repositoryStub, 'create');
    const orderData = {
      email: 'valid_email@email.com',
      cpf: '12345612312',
      delivered: false,
    };
    const paymentData = {
      orderPrice: 10,
      orderReference: Math.floor(Math.random() * 10001),
      cardNumber: '5448280000000007',
      cvv: '235',
      expirationMonth: '12',
      expirationYear: '2020',
      cardHolderName: 'Fulano de Tal',
    };
    const httpRequest = {
      orderData,
      paymentData,
    };
    await sut.createOrder(httpRequest);
    expect(repositorySpy).toHaveBeenCalledWith(httpRequest);
  });

  it('It must return 500 if create throws an error', async () => {
    const { sut, repositoryStub } = makeSut();
    jest.spyOn(repositoryStub, 'create').mockImplementationOnce(new Error());
    const httpResponse = await sut.createOrder(makeFakeRequest());
    expect(httpResponse).toEqual(HTTP_SERVER_ERROR_500(new Error()));
  });

  it('it must update an order with 200 status code given valid data', async () => {
    const { sut } = makeSut();
    const httpRequest = { delivered: true };
    const httpResponse = await sut.updateOrder(httpRequest);
    expect(httpResponse).toEqual(
      HTTP_OK_200({
        _id: 1,
        email: 'valid_email@email.com',
        cpf: '12345612312',
        tid: '2134534253252',
        delivered: true,
      })
    );
  });

  it('it must call Repository with correct update order value', async () => {
    const { sut, repositoryStub } = makeSut();
    const repositorySpy = jest.spyOn(repositoryStub, 'update');
    const httpRequest = makeFakeRequest();
    await sut.updateOrder(httpRequest);
    expect(repositorySpy).toHaveBeenCalledWith(httpRequest);
  });

  it('it must return 400 status code if updateOrder returns null', async () => {
    const { sut, repositoryStub } = makeSut();
    jest.spyOn(repositoryStub, 'update').mockReturnValueOnce(null);
    const httpRequest = makeFakeRequest();
    const httpResponse = await sut.updateOrder(httpRequest);
    expect(httpResponse).toEqual(
      HTTP_BAD_REQUEST_400({ message: 'Invalid param' })
    );
  });

  it('It must return 500 if update throws an error', async () => {
    const { sut, repositoryStub } = makeSut();
    jest.spyOn(repositoryStub, 'update').mockImplementationOnce(new Error());
    const httpResponse = await sut.updateOrder(makeFakeRequest());
    expect(httpResponse).toEqual(HTTP_SERVER_ERROR_500(new Error()));
  });
});
