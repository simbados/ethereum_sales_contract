const BigNumber = require('bignumber.js')

const SalesContract = artifacts.require("SalesContract");

contract('Successful Tests for ContractRetraction', async (accounts) => {
    let instance
    const book = "book"
    var price
    const [seller, buyer, intermediator, randomGuy] = accounts


    beforeEach('Setup of contract', async function () {
        // Given
        instance = await SalesContract.new(buyer, intermediator)
        price = web3.utils.toBN((web3.utils.toWei('1', 'ether')))
    })

    it("Retract paid contract buyer and intermediator", async () => {
        // Given 
        await instance.setItem(book, price)
        await instance.payItem({value: price, from: buyer})

        // When 
        await instance.retractContract({from: buyer})
        await instance.retractContract({from: intermediator})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })

    it("Retract unpaid contract buyer and intermediator", async () => {
        // Given 
        await instance.setItem(book, price)

        // When 
        await instance.retractContract({from: buyer})
        await instance.retractContract({from: intermediator})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })

    it("Retract paid contract seller and intermediator", async () => {
        // Given 
        await instance.setItem(book, price)
        await instance.payItem({value: price, from: buyer})

        // When 
        await instance.retractContract({from: seller})
        await instance.retractContract({from: intermediator})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })

    it("Retract unpaid contract seller and intermediator", async () => {
        // Given 
        await instance.setItem(book, price)

        // When 
        await instance.retractContract({from: seller})
        await instance.retractContract({from: intermediator})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })

    it("Retract paid contract seller and buyer", async () => {
        // Given 
        await instance.setItem(book, price)
        await instance.payItem({value: price, from: buyer})

        // When 
        await instance.retractContract({from: seller})
        await instance.retractContract({from: buyer})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })

    it("Retract unpaid contract seller and buyer", async () => {
        // Given 
        await instance.setItem(book, price)

        // When 
        await instance.retractContract({from: seller})
        await instance.retractContract({from: buyer})

        // Then
        assert.strictEqual(await instance.contractRetracted(), true)
    })
    
    it("Withdraw after retraction", async () => {
        // Given 
        await instance.setItem(book, price)
        await instance.payItem({value: price, from: buyer})
        let balanceContractBefore = new BigNumber(await web3.eth.getBalance(instance.address))
        await instance.retractContract({from: seller})
        await instance.retractContract({from: buyer})

        // When 
        

        let balanceBuyerBefore = new BigNumber(await web3.eth.getBalance(buyer))
        let hash = await instance.withdrawAfterRetraction({from: buyer})
        let balanceRaw = await web3.eth.getBalance(buyer)
        let expectedBalanceBuyerAfter = new BigNumber(balanceRaw)
        let tx = hash["tx"]
        let transactionReceipt = await web3.eth.getTransactionReceipt(tx)
        let gasUsed = transactionReceipt.gasUsed
        let transaction = await web3.eth.getTransaction(tx);
        let gasPrice = transaction.gasPrice
        let gasCost = new BigNumber(gasPrice * gasUsed)
        let actualAfterBalanceBuyer = balanceBuyerBefore.minus(gasCost).plus(price)

        // Then
        // Should not be necessary? Normally web3 returns bigNumber
        let balanceContractAfter = new BigNumber(await web3.eth.getBalance(instance.address))
            
        assert.strictEqual(actualAfterBalanceBuyer.toString(), expectedBalanceBuyerAfter.toString())
        assert.strictEqual(balanceContractBefore.toString(), price.toString())
        assert.strictEqual(balanceContractAfter.toString(), '0')
        assert.strictEqual(await instance.contractIsClosed(), true)
    })
})