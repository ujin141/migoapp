#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ObjCExceptionCatcher : NSObject

/// Executes the given block and catches any Objective-C NSException.
/// Returns YES if the block executed successfully, NO if an exception was caught.
+ (BOOL)catchException:(void(NS_NOESCAPE ^)(void))block;

@end

NS_ASSUME_NONNULL_END
