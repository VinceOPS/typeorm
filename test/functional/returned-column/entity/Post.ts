import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {ReturnedColumn} from "../../../../src";

@Entity()
export class Post {
    @ReturnedColumn({ name: "id" })
    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    @ReturnedColumn({ name: "category" })
    category: string;
}
