#import "ObjCExceptionCatcher.h"

@implementation ObjCExceptionCatcher

+ (BOOL)catchException:(void(NS_NOESCAPE ^)(void))block {
    @try {
        block();
        return YES;
    }
    @catch (NSException *exception) {
        NSLog(@"[Migo] Caught ObjC exception during initialization: %@ — %@",
              exception.name, exception.reason);
        return NO;
    }
}

@end
