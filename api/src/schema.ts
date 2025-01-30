import { makeExecutableSchema } from "@graphql-tools/schema";
import ServiceResolvers from "./services/serviceResolver";
import { ServiceTypeDefs } from "./services/serviceSchema";

export const schema = makeExecutableSchema({
  typeDefs: ServiceTypeDefs,
  resolvers: ServiceResolvers,
});
