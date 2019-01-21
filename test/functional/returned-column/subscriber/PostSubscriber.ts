import { EntitySubscriberInterface, EventSubscriber } from "../../../../src";
import { Post } from "../entity/Post";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    afterUpdate() {}
    afterRemove() {}
}
