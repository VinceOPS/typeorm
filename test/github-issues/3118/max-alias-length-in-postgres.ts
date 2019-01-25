import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { CategoryWithVeryLongName } from "./entity/CategoryWithVeryLongName";
import { AuthorWithVeryLongName as PostAuthorWithVeryLongName, AuthorWithVeryLongName } from "./entity/PostAuthorWithVeryLongName";
import { PostWithVeryLongName } from "./entity/PostWithVeryLongName";

/**
 * @see https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 * "The system uses no more than NAMEDATALEN-1 bytes of an identifier; longer names can be
 * written in commands, but they will be truncated. By default, NAMEDATALEN is 64 so the
 * maximum identifier length is 63 bytes. If this limit is problematic, it can be raised
 * by changing the NAMEDATALEN constant in src/include/pg_config_manual.h."
 */
describe("other issues > shorten alias names for Postgres when they are longer than 63 characters", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to load deep nested entity, even with long aliases", () => Promise.all(connections.map(async (connection) => {
        const author = new PostAuthorWithVeryLongName();
        author.firstName = "Jean";
        const post = new PostWithVeryLongName();
        post.authorWithVeryLongName = author;
        const category = new CategoryWithVeryLongName();
        category.postsWithVeryLongName = category.postsWithVeryLongName || [];
        category.postsWithVeryLongName.push(post);

        await connection.getRepository(AuthorWithVeryLongName).save(author);
        await connection.getRepository(PostWithVeryLongName).save(post);
        await connection.getRepository(CategoryWithVeryLongName).save(category);

        const loadedCategory = await connection.manager.findOne(CategoryWithVeryLongName, { relations: [
            "postsWithVeryLongName",
            // before: used to generate an "AS" alias like `CategoryWithVeryLongName__postsWithVeryLongName__authorWithVeryLongName_firstName`
            // now: "CaWiVeLoNa__poWiVeLoNa__auWiVeLoNa_firstName", which is acceptable by Postgres (limit to 63 characters)
            "postsWithVeryLongName.authorWithVeryLongName"
        ] });

        expect(loadedCategory).not.to.be.undefined;
        expect(loadedCategory!.postsWithVeryLongName).not.to.be.undefined;
        expect(loadedCategory!.postsWithVeryLongName).not.to.be.empty;
        expect(loadedCategory!.postsWithVeryLongName[0].authorWithVeryLongName).not.to.be.undefined;
        expect(loadedCategory!.postsWithVeryLongName[0].authorWithVeryLongName.firstName).to.equal(author.firstName);
    })));

});
