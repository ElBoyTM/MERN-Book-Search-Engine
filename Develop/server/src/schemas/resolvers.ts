import { AuthenticationError } from 'apollo-server-express';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        const foundUser = await User.findOne({ _id: context.user._id }).select('-__v -password');
        return foundUser;
      }
      throw new AuthenticationError('Not logged in');
    },
  },

  Mutation: {
    addUser: async (_parent: any, args: any) => {
      const user = await User.create(args);
      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    login: async (_parent: any, { email, password }: any) => {
      const user = await User.findOne({ $or: [{ username: email }, { email }] });
      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Wrong password!');
      }

      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    saveBook: async (_parent: any, { bookData }: any, context: any) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: bookData } },
          { new: true}
        );
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    removeBook: async (_parent: any, { bookId }: any, context: any) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

export default resolvers;