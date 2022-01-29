import * as crypto from "crypto"

class Transaction {
  constructor(
    public amount: number,
    public payer: string, //public key
    public payee: string //public key
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

class Block {
  public nonce = Math.round(Math.random() * 9999999999)

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public timeStamp = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this)
    const hash = crypto.createHash("SHA256")
    hash.update(str).end()

    return hash.digest("hex")
  }
}

class Chain {
  public static instance = new Chain()

  chain: Block[]

  constructor() {
    this.chain = [new Block("", new Transaction(100, "genesis", "serhan"))]
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1]
  }

  mine(nonce: number) {
    let solution = 1
    console.log("mining...")

    while (true) {
      const hash = crypto.createHash("MD5")
      hash.update((nonce + solution).toString()).end()

      const attempt = hash.digest("hex")

      if (attempt.substr(0, 4) === "0000") {
        console.log("Solved " + solution)
        return solution
      }

      solution += 1
    }
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("SHA256")
    verifier.update(transaction.toString())

    const isValid = verifier.verify(senderPublicKey, signature)

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction)
      this.mine(newBlock.nonce)
      this.chain.push(newBlock)
    }
  }
}

class Wallet {
  public publicKey: string
  public privateKey: string

  constructor() {
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    })

    this.publicKey = keyPair.publicKey
    this.privateKey = keyPair.privateKey
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey)

    const sign = crypto.createSign("SHA256")
    sign.update(transaction.toString()).end()

    const signature = sign.sign(this.privateKey)
    Chain.instance.addBlock(transaction, this.publicKey, signature)
  }
}

//
