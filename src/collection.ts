import { Address } from "@graphprotocol/graph-ts";
import { Nft } from "../generated/Nft/Nft";
import { Collection } from "../generated/schema";

export const handleCollection = (
  address: Address,
  contract: Nft,
  owner: Address
): Collection => {
  const addressHex = address.toHex();
  let collection = Collection.load(addressHex);
  if (collection === null) {
    collection = new Collection(addressHex);
    collection.address = address;
    collection.owner = owner;
  }
  const name = contract.try_name();
  collection.name = !name.reverted ? name.value : null;
  const symbol = contract.try_symbol();
  collection.symbol = !symbol.reverted ? symbol.value : null;
  collection.save();
  return collection;
};
