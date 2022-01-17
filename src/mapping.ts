import { BigInt } from "@graphprotocol/graph-ts"
import {
  Transfer, Contract
} from "../generated/Contract/Contract"
import { Transaction, User } from "../generated/schema"
import { jsonToString, parseTokenURI } from "./parsing";

export function handleTransfer(event: Transfer): void {

  const tokenId = event.params.tokenId;
  const tokenAddress = event.address;
  const contract = Contract.bind(tokenAddress);
  const id = `${tokenAddress.toHex()}_${tokenId}`

  const userId = event.transaction.from
  let user = User.load(userId.toHex())
  if(user){
    const balanceOf = contract.try_balanceOf(event.transaction.from)
    user.balanceOf = !balanceOf.reverted ? balanceOf.value : BigInt.fromI32(0)
    user.totalTransactions = user.totalTransactions + BigInt.fromI32(1)
  } else {
    user = new User(userId.toHex())
    const balanceOf = contract.try_balanceOf(event.transaction.from);
    user.balanceOf = !balanceOf.reverted ? balanceOf.value : BigInt.fromI32(0);

    user.totalTransactions = BigInt.fromI32(0);
  }
  user.save()

  let transaction = Transaction.load(id)
  if (!transaction) {
    transaction = new Transaction(id)
    transaction.tokenId = tokenId
    transaction.hash = event.transaction.hash.toHex()
    transaction.txFrom = event.transaction.from
    // transaction.to = event.transaction.to
    transaction.txTo = event.transaction.to
    transaction.value = event.transaction.value
    transaction.gasLimit = event.transaction.gasLimit
    transaction.gasPrice = event.transaction.gasPrice
    transaction.timestamp = event.block.timestamp
    transaction.blockNumber = event.block.number

    const ownerOf = contract.try_ownerOf(tokenId);
    transaction.ownerOf = !ownerOf.reverted ? ownerOf.value : null;

    const name = contract.try_name();
    transaction.name = !name.reverted ? name.value : null;

    const symbol = contract.try_symbol();
    transaction.symbol = !symbol.reverted ? symbol.value : null;

    const result = contract.try_tokenURI(tokenId);
    const uri = !result.reverted ? result.value : null;
    transaction.uri = uri;
    // @todo Can this be cleaned up more?
    if (uri) {
      const parsedUri = parseTokenURI(uri);
      if (parsedUri) {
        transaction.image = jsonToString(parsedUri.get("image"));
        transaction.name = jsonToString(parsedUri.get("name"));
        transaction.description = jsonToString(parsedUri.get("description"));
      }
    }
    transaction.user = userId.toHex();
    transaction.save()
  }

}

export function handleApproval(event: Transfer): void {
  const tokenId = event.params.tokenId;
  const tokenAddress = event.address;
  const id = `${tokenAddress.toHex()}_${tokenId}`

  let transaction = Transaction.load(id)
  if (!transaction) {
    transaction = new Transaction(id)
    transaction.tokenId = tokenId
    transaction.hash = event.transaction.hash.toHex()
    transaction.apFrom = event.params.from
    transaction.apTo = event.params.to
    transaction.blockNumber = event.block.number
  } else {
    transaction.apFrom = event.params.from
    transaction.apTo = event.params.to
  }
  transaction.save()
}
