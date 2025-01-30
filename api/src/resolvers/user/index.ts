import { Resolver, Query } from "type-graphql";

// /api/src/resolvers/user/index.ts
@Resolver()
export class UserResolver {
//   @Query(() => String)
  hello() {
    return "Hello World";
  }
}
