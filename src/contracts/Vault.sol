// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
    address public owner;
    uint256 public balance;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        require(msg.value > 0, "No value sent");
        balance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(balance >= amount, "Insufficient balance");

        balance -= amount;
        payable(owner).transfer(amount);

        emit Withdrawn(owner, amount);
    }

    function getBalance() external view returns (uint256) {
        return balance;
    }
}
