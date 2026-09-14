import AVFoundation
let a=CommandLine.arguments; let src=URL(fileURLWithPath:a[1]), dst=URL(fileURLWithPath:a[2]); let bitrate=Int(a[3])!
try? FileManager.default.removeItem(at:dst)
let asset=AVURLAsset(url:src); let track=asset.tracks(withMediaType:.video)[0]
let reader=try! AVAssetReader(asset:asset)
let out=AVAssetReaderTrackOutput(track:track,outputSettings:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]); out.alwaysCopiesSampleData=false; reader.add(out)
let writer=try! AVAssetWriter(outputURL:dst,fileType:.mp4); writer.shouldOptimizeForNetworkUse=true
let settings:[String:Any]=[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:1920,AVVideoHeightKey:1080,AVVideoScalingModeKey:AVVideoScalingModeResizeAspectFill,
 AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:bitrate,AVVideoProfileLevelKey:AVVideoProfileLevelH264HighAutoLevel,AVVideoMaxKeyFrameIntervalKey:60,AVVideoExpectedSourceFrameRateKey:30,AVVideoAllowFrameReorderingKey:true,AVVideoH264EntropyModeKey:AVVideoH264EntropyModeCABAC]]
let input=AVAssetWriterInput(mediaType:.video,outputSettings:settings); input.expectsMediaDataInRealTime=false; writer.add(input)
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime:.zero)
let q=DispatchQueue(label:"enc"); let done=DispatchSemaphore(value:0); var n=0
input.requestMediaDataWhenReady(on:q){
  while input.isReadyForMoreMediaData{
    if let sb=out.copyNextSampleBuffer(){ if !input.append(sb){print("append failed",writer.error as Any)}; n+=1 }
    else { input.markAsFinished(); writer.finishWriting{ done.signal() }; return }
  }
}
done.wait()
print("status",writer.status.rawValue,"error",writer.error as Any,"frames",n)
let o=AVURLAsset(url:dst); let t=o.tracks(withMediaType:.video)[0]
print("out size",t.naturalSize,"dur",CMTimeGetSeconds(o.duration),"rate",t.estimatedDataRate,"bytes",(try! FileManager.default.attributesOfItem(atPath:dst.path)[.size]) as Any, "audio",o.tracks(withMediaType:.audio).count)
