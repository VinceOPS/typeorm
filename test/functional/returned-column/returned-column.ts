import "reflect-metadata";
import * as sinon from "sinon";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {PostSubscriber} from "./subscriber/PostSubscriber";
import {DatabaseType} from "../../../src";

function saveNewPost(connection: Connection) {
    const post = new Post();
    post.id = 1;
    post.title = "hello world";
    post.category = "lifestyle";
    return connection.manager.save(post);
}

function registerAndMockSubscriber(connection: Connection) {
    const subscriber = new PostSubscriber();
    const mockSubscriber = sinon.mock(subscriber);
    connection.subscribers.push(subscriber);
    return mockSubscriber;
}

describe("returned-column > are returned as a partial entity in subscribers, using `delete` and `update` queries", () => {
    let allConnections: Connection[];
    let supportedConnections: Connection[];
    let notSupportedConnections: Connection[];

    before(async () => {
        const supportedRdbms: DatabaseType[] = ["mssql", "oracle", "postgres"];
        const notSupportedRdbms: DatabaseType[] = ["mysql", "mariadb", "sqlite"];

        allConnections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: notSupportedRdbms.concat(supportedRdbms),
        });

        supportedConnections = allConnections.filter(c => supportedRdbms.includes(c.driver.options.type));
        notSupportedConnections = allConnections.filter(c => !supportedConnections.includes(c));
    });
    beforeEach(() => reloadTestingDatabases(allConnections));
    after(() => closeTestingConnections(allConnections));

    it("broadcasts the partial entity (built with returned columns) to afterUpdate event", () => Promise.all(supportedConnections.map(async connection => {
        const post = await saveNewPost(connection);
        const mockSubscriber = registerAndMockSubscriber(connection);

        // prepare the update and the expected partial entity
        const entity = { id: post.id, category: post.category };
        mockSubscriber.expects("afterUpdate").once().withArgs(sinon.match({ entity }));

        // proceed to update and ensure the partial entity was broadcasted to `afterUpdate`
        await connection.manager.update(Post, post.id, { title: "Don't forget Typings" });
        mockSubscriber.verify();
    })));

    it("broadcasts the partial entity (built with returned columns) to afterRemove event", () => Promise.all(supportedConnections.map(async connection => {
        const post = await saveNewPost(connection);
        const mockSubscriber = registerAndMockSubscriber(connection);

        const entity = { id: post.id, category: post.category };
        mockSubscriber.expects("afterRemove").once().withArgs(sinon.match({ entity }));

        // proceed to removal and ensure the partial entity was broadcasted to `afterRemove`
        await connection.manager.delete(Post, post.id);
        mockSubscriber.verify();
    })));

    it("does not broadcast anything if RDBMS does not support `returning` or `output` clauses", () => Promise.all(notSupportedConnections.map(async connection => {
        const post = await saveNewPost(connection);
        const mockSubscriber = registerAndMockSubscriber(connection);

        mockSubscriber.expects("afterUpdate").once().withArgs(sinon.match({ entity: undefined }));
        mockSubscriber.expects("afterRemove").once().withArgs(sinon.match({ entity: undefined }));

        // proceed to update and ensure the partial entity was broadcasted to `afterEvent`
        await connection.manager.update(Post, post.id, { title: "All you need is TypeScript" });
        await connection.manager.delete(Post, post.id);
        mockSubscriber.verify();
    })));
});
