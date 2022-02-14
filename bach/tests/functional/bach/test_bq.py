import bach
from bach.dialect_bq import dtype_structure


def _test_bq_from_table():
    from sqlalchemy.engine import create_engine
    engine = create_engine('bigquery://objectiv-production/95166736',
                           credentials_path='/home/tom/objective-production-tom-jansen-gcp-ds.json')

    df = bach.DataFrame.from_table(engine=engine, table_name="bq_test", index=['visitorId'])
    print(df.head())

def _test_parse_nested():
    nested = """
ARRAY<
  STRUCT<
    hitNumber INT64, 
    time INT64, 
    hour INT64, 
    minute INT64, 
    isSecure BOOL, 
    isInteraction BOOL, 
    isEntrance BOOL, 
    isExit BOOL, 
    referer STRING, 
    page STRUCT<pagePath STRING, hostname STRING, pageTitle STRING, searchKeyword STRING, searchCategory STRING, pagePathLevel1 STRING, pagePathLevel2 STRING, pagePathLevel3 STRING, pagePathLevel4 STRING>, 
    transaction STRUCT<transactionId STRING, transactionRevenue INT64, transactionTax INT64, transactionShipping INT64, affiliation STRING, currencyCode STRING, localTransactionRevenue INT64, localTransactionTax INT64, localTransactionShipping INT64, transactionCoupon STRING>, item STRUCT<transactionId STRING, productName STRING, productCategory STRING, productSku STRING, itemQuantity INT64, itemRevenue INT64, currencyCode STRING, localItemRevenue INT64>, 
    contentInfo STRUCT<contentDescription STRING>, 
    appInfo STRUCT<name STRING, version STRING, id STRING, installerId STRING, appInstallerId STRING, appName STRING, appVersion STRING, appId STRING, screenName STRING, landingScreenName STRING, exitScreenName STRING, screenDepth STRING>, 
    exceptionInfo STRUCT<description STRING, isFatal BOOL, exceptions INT64, fatalExceptions INT64>, 
    eventInfo STRUCT<eventCategory STRING, eventAction STRING, eventLabel STRING, eventValue INT64>, 
    product ARRAY<STRUCT<productSKU STRING, v2ProductName STRING, v2ProductCategory STRING, productVariant STRING, productBrand STRING, productRevenue INT64, localProductRevenue INT64, productPrice INT64, localProductPrice INT64, productQuantity INT64, productRefundAmount INT64, localProductRefundAmount INT64, isImpression BOOL, isClick BOOL, customDimensions ARRAY<STRUCT<index INT64, value STRING>>, customMetrics ARRAY<STRUCT<index INT64, value INT64>>, productListName STRING, productListPosition INT64, productCouponCode STRING>>, promotion ARRAY<STRUCT<promoId STRING, promoName STRING, promoCreative STRING, promoPosition STRING>>, promotionActionInfo STRUCT<promoIsView BOOL, promoIsClick BOOL>, refund STRUCT<refundAmount INT64, localRefundAmount INT64>, eCommerceAction STRUCT<action_type STRING, step INT64, option STRING>, 
    experiment ARRAY<STRUCT<experimentId STRING, experimentVariant STRING>>, 
    publisher STRUCT<dfpClicks INT64, dfpImpressions INT64, dfpMatchedQueries INT64, dfpMeasurableImpressions INT64, dfpQueries INT64, dfpRevenueCpm INT64, dfpRevenueCpc INT64, dfpViewableImpressions INT64, dfpPagesViewed INT64, adsenseBackfillDfpClicks INT64, adsenseBackfillDfpImpressions INT64, adsenseBackfillDfpMatchedQueries INT64, adsenseBackfillDfpMeasurableImpressions INT64, adsenseBackfillDfpQueries INT64, adsenseBackfillDfpRevenueCpm INT64, adsenseBackfillDfpRevenueCpc INT64, adsenseBackfillDfpViewableImpressions INT64, adsenseBackfillDfpPagesViewed INT64, adxBackfillDfpClicks INT64, adxBackfillDfpImpressions INT64, adxBackfillDfpMatchedQueries INT64, adxBackfillDfpMeasurableImpressions INT64, adxBackfillDfpQueries INT64, adxBackfillDfpRevenueCpm INT64, adxBackfillDfpRevenueCpc INT64, adxBackfillDfpViewableImpressions INT64, adxBackfillDfpPagesViewed INT64, adxClicks INT64, adxImpressions INT64, adxMatchedQueries INT64, adxMeasurableImpressions INT64, adxQueries INT64, adxRevenue INT64, adxViewableImpressions INT64, adxPagesViewed INT64, adsViewed INT64, adsUnitsViewed INT64, adsUnitsMatched INT64, viewableAdsViewed INT64, measurableAdsViewed INT64, adsPagesViewed INT64, adsClicked INT64, adsRevenue INT64, dfpAdGroup STRING, dfpAdUnits STRING, dfpNetworkId STRING>, 
    customVariables ARRAY<STRUCT<index INT64, customVarName STRING, customVarValue STRING>>, 
    customDimensions ARRAY<STRUCT<index INT64, value STRING>>, customMetrics ARRAY<STRUCT<index INT64, value INT64>>, type STRING, social STRUCT<socialInteractionNetwork STRING, socialInteractionAction STRING, socialInteractions INT64, socialInteractionTarget STRING, socialNetwork STRING, uniqueSocialInteractions INT64, hasSocialSourceReferral STRING, socialInteractionNetworkAction STRING>, latencyTracking STRUCT<pageLoadSample INT64, pageLoadTime INT64, pageDownloadTime INT64, redirectionTime INT64, speedMetricsSample INT64, domainLookupTime INT64, serverConnectionTime INT64, serverResponseTime INT64, domLatencyMetricsSample INT64, domInteractiveTime INT64, domContentLoadedTime INT64, userTimingValue INT64, userTimingSample INT64, userTimingVariable STRING, userTimingCategory STRING, userTimingLabel STRING>, sourcePropertyInfo STRUCT<sourcePropertyDisplayName STRING, sourcePropertyTrackingId STRING>, contentGroup STRUCT<contentGroup1 STRING, contentGroup2 STRING, contentGroup3 STRING, contentGroup4 STRING, contentGroup5 STRING, previousContentGroup1 STRING, previousContentGroup2 STRING, previousContentGroup3 STRING, previousContentGroup4 STRING, previousContentGroup5 STRING, contentGroupUniqueViews1 INT64, contentGroupUniqueViews2 INT64, contentGroupUniqueViews3 INT64, contentGroupUniqueViews4 INT64, contentGroupUniqueViews5 INT64>, 
    dataSource STRING, 
    publisher_infos ARRAY<
      STRUCT<dfpClicks INT64, dfpImpressions INT64, dfpMatchedQueries INT64, dfpMeasurableImpressions INT64, dfpQueries INT64, dfpRevenueCpm INT64, dfpRevenueCpc INT64, dfpViewableImpressions INT64, dfpPagesViewed INT64, adsenseBackfillDfpClicks INT64, adsenseBackfillDfpImpressions INT64, adsenseBackfillDfpMatchedQueries INT64, adsenseBackfillDfpMeasurableImpressions INT64, adsenseBackfillDfpQueries INT64, adsenseBackfillDfpRevenueCpm INT64, adsenseBackfillDfpRevenueCpc INT64, adsenseBackfillDfpViewableImpressions INT64, adsenseBackfillDfpPagesViewed INT64, adxBackfillDfpClicks INT64, adxBackfillDfpImpressions INT64, adxBackfillDfpMatchedQueries INT64, adxBackfillDfpMeasurableImpressions INT64, adxBackfillDfpQueries INT64, adxBackfillDfpRevenueCpm INT64, adxBackfillDfpRevenueCpc INT64, adxBackfillDfpViewableImpressions INT64, adxBackfillDfpPagesViewed INT64, adxClicks INT64, adxImpressions INT64, adxMatchedQueries INT64, adxMeasurableImpressions INT64, adxQueries INT64, adxRevenue INT64, adxViewableImpressions INT64, adxPagesViewed INT64, adsViewed INT64, adsUnitsViewed INT64, adsUnitsMatched INT64, viewableAdsViewed INT64, measurableAdsViewed INT64, adsPagesViewed INT64, adsClicked INT64, adsRevenue INT64, dfpAdGroup STRING, dfpAdUnits STRING, dfpNetworkId STRING>
    >>>
    """

    import json
    print(json.dumps(dtype_structure(nested), indent=4))