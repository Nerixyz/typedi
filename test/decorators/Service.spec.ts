import "reflect-metadata";
import {Container} from "../../src/Container";
import {Service} from "../../src/decorators/Service";
const assert = require('assert');

describe("Service Decorator", function() {

    beforeEach(() => Container.reset());

    it("should register class in the container, and its instance should be retrievable", function() {
        @Service()
        class TestService {
        }
        @Service("super.service")
        class NamedService {
        }
        Container.get(TestService).should.be.instanceOf(TestService);
        Container.get(TestService).should.not.be.instanceOf(NamedService);
    });

    it("should register class in the container with given name, and its instance should be retrievable", function() {
        @Service()
        class TestService {
        }
        @Service("super.service")
        class NamedService {
        }
        Container.get("super.service").should.be.instanceOf(NamedService);
        Container.get("super.service").should.not.be.instanceOf(TestService);
    });

    it("should register class in the container, and its parameter dependencies should be properly initialized", function() {
        @Service()
        class TestService {
        }
        @Service()
        class SecondTestService {
        }
        @Service()
        class TestServiceWithParameters {
            constructor(public testClass: TestService, public secondTest: SecondTestService) {
            }
        }
        Container.get(TestServiceWithParameters).should.be.instanceOf(TestServiceWithParameters);
        Container.get(TestServiceWithParameters).testClass.should.be.instanceOf(TestService);
        Container.get(TestServiceWithParameters).secondTest.should.be.instanceOf(SecondTestService);
    });

    it("should support factory functions", function() {

        class Engine {
            constructor(public serialNumber: string) {
            }
        }

        function createCar() {
            return new Car("BMW", new Engine("A-123"));
        }

        @Service({ factory: createCar })
        class Car {
            constructor(public name: string, public engine: Engine) {
            }
        }

        assert.strictEqual(Container.get(Car).name, "BMW");
        assert.strictEqual(Container.get(Car).engine.serialNumber, "A-123");

    });

    it("should support factory classes", function() {

        @Service()
        class Engine {
            public serialNumber = "A-123";
        }

        @Service()
        class CarFactory {

            constructor(public engine: Engine) {
            }

            createCar() {
                return new Car("BMW", this.engine);
            }

        }

        @Service({ factory: [CarFactory, "createCar"] })
        class Car {
            name: string;
            constructor(name: string, public engine: Engine) {
                this.name = name;
            }
        }

        assert.strictEqual(Container.get(Car).name, "BMW");
        assert.strictEqual(Container.get(Car).engine.serialNumber, "A-123");

    });

    it("should support factory function with arguments", function() {

        @Service()
        class Engine {
            public type = "V8";
        }

        @Service()
        class CarFactory {
            createCar(engine: Engine) {
                engine.type = "V6";
                return new Car(engine);
            }
        }

        @Service({ factory: [CarFactory, "createCar"] })
        class Car {
            constructor(public engine: Engine) {
            }
        }

        assert.strictEqual(Container.get(Car).engine.type, "V6");

    });

    it("should support transient services", function() {

        @Service()
        class Car {
            public serial = Math.random();
        }

        @Service({ transient: true })
        class Engine {
            public serial = Math.random();
        }

        const car1Serial = Container.get(Car).serial;
        const car2Serial = Container.get(Car).serial;
        const car3Serial = Container.get(Car).serial;

        const engine1Serial = Container.get(Engine).serial;
        const engine2Serial = Container.get(Engine).serial;
        const engine3Serial = Container.get(Engine).serial;

        assert.strictEqual(car1Serial, car2Serial);
        assert.strictEqual(car1Serial, car3Serial);

        assert.notStrictEqual(engine1Serial, engine2Serial);
        assert.notStrictEqual(engine2Serial, engine3Serial);
        assert.notStrictEqual(engine3Serial, engine1Serial);
    });

    it("should support transient services in scoped containers", function() {

        @Service()
        class Car {
            public serial = Math.random();
        }

        @Service({ transient: true })
        class Engine {
            public serial = Math.random();
        }

        const container = Container.of('container');
        const car1Serial = container.get(Car).serial;
        const car2Serial = container.get(Car).serial;
        const car3Serial = container.get(Car).serial;

        const engine1Serial = container.get(Engine).serial;
        const engine2Serial = container.get(Engine).serial;
        const engine3Serial = container.get(Engine).serial;

        assert.strictEqual(car1Serial, car2Serial);
        assert.strictEqual(car1Serial, car3Serial);

        assert.notStrictEqual(engine1Serial, engine2Serial);
        assert.notStrictEqual(engine2Serial, engine3Serial);
        assert.notStrictEqual(engine3Serial, engine1Serial);
    });

    it("should support global services", function() {

        @Service()
        class Engine {
            public name = "sporty";
        }

        @Service({ global: true })
        class Car {
            public name = "SportCar";
        }

        const globalContainer = Container;
        const scopedContainer = Container.of("enigma");

        assert.strictEqual(globalContainer.get(Car).name, "SportCar");
        assert.strictEqual(globalContainer.get(Car).name, "SportCar");
        assert.strictEqual(scopedContainer.get(Car).name, "SportCar");

        assert.strictEqual(globalContainer.get(Engine).name,"sporty");
        assert.strictEqual(scopedContainer.get(Engine).name,"sporty");

        globalContainer.get(Car).name = "MyCar";
        globalContainer.get(Engine).name = "regular";

        assert.strictEqual(globalContainer.get(Car).name,"MyCar");
        assert.strictEqual(scopedContainer.get(Car).name,"MyCar");

        assert.strictEqual(globalContainer.get(Engine).name,"regular");
        assert.strictEqual(scopedContainer.get(Engine).name,"sporty");
    });

});
